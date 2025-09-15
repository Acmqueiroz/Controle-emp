import React, {use, useState} from "react";




const sabores =[
    '4 Queijos', 'Bacalhau', 'Banana', 'Calabresa', 'Camarão', 'Camarão com Requeijão',
  'Carne Seca', 'Carne Seca com Requeijão', 'Chocolate', 'Frango',
  'Frango com Ameixa e Bacon', 'Frango com Azeitona', 'Frango com Bacon',
  'Frango com Cheddar', 'Frango com Palmito', 'Frango com Requeijão',
  'Palmito', 'Pizza', 'Queijo', 'Queijo com Alho', 'Queijo com Cebola', 'Romeu e Julieta'
]


function ControleDiario() {
    conts [DataTransfer, setData] = useState(() => new Data().ToISOString().split('T')[0]) 
    const [contagem, setContagem]= useState(
        sabores.map(sabor => ({
            sabor, 
             freezer: '',
      estufa: '',
      perdas: '',

        }))
    )

     const handleChange = (index, field, value) => {
    const novaContagem = [...contagem];
    novaContagem[index][field] = value;
    setContagem(novaContagem);
  };

  const handleSalvar = () => {
    console.log('Salvar contagem:', { data, contagem });
    // Aqui depois você salva no Supabase
  };



return (
    <div style={ {padding: '20px'}}>
            </div>
)
}